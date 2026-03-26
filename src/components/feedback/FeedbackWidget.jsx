import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageSquarePlus, X, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../ui/Input';

const SHEET_URL = import.meta.env.VITE_FEEDBACK_SHEET_URL;

function resizeImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(e.target.result);
          return;
        }
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const reset = () => {
    setTitle('');
    setComment('');
    setScreenshot(null);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const resized = await resizeImage(file);
    setScreenshot(resized);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImage(file);
    },
    [handleImage]
  );

  const onFileChange = useCallback(
    (e) => {
      handleImage(e.target.files[0]);
      e.target.value = '';
    },
    [handleImage]
  );

  const handleSend = async () => {
    if (!title.trim() || !comment.trim()) {
      toast.error('Please fill in both title and comment');
      return;
    }

    if (!SHEET_URL) {
      toast.error('Feedback endpoint not configured.');
      return;
    }

    setSending(true);
    try {
      await new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.name = 'feedback-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = SHEET_URL;
        form.target = 'feedback-frame';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'payload';
        input.value = JSON.stringify({
          title: title.trim(),
          comment: comment.trim(),
          screenshot: screenshot || '',
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        });
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();

        // Give it time to complete, then clean up
        setTimeout(() => {
          document.body.removeChild(form);
          document.body.removeChild(iframe);
          resolve();
        }, 3000);
      });

      toast.success('Feedback sent — thank you!');
      handleClose();
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-ww-blue text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-ww-blue/90 transition-colors cursor-pointer"
        aria-label="Send feedback"
      >
        <MessageSquarePlus size={22} />
      </button>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 z-20" onClick={handleClose} />

          {/* Dialog */}
          <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-ww-navy">Send Feedback</h2>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary"
                />

                <Input
                  label="Comment"
                  multiline
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the issue or suggestion..."
                />

                {/* Screenshot */}
                {screenshot ? (
                  <div className="relative">
                    <img
                      src={screenshot}
                      alt="Screenshot preview"
                      className="rounded-lg border border-border max-h-48 object-contain w-full bg-slate-50"
                    />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg border border-border hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-ww-blue bg-ww-blue/5'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <ImagePlus
                      size={24}
                      className={`mx-auto mb-2 ${dragOver ? 'text-ww-blue' : 'text-slate-400'}`}
                    />
                    <p className="text-sm text-slate-500">
                      Drop a screenshot or click to upload (optional)
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-4 py-2 text-sm font-medium text-white bg-ww-blue rounded-full hover:bg-ww-blue/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {sending && <Loader2 size={14} className="animate-spin" />}
                  {sending ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
