import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aboutApi } from '../../api/services';
import PageHeader from '../../components/ui/PageHeader';
import { Save, Loader2, Pencil, MapPin, Mail, Camera, UsersRound } from 'lucide-react';
import Modal from '../../components/Modal';

export default function AboutPage() {
  const qc = useQueryClient();
  const photoRef = useRef();
  const [editOpen, setEditOpen] = useState(false);

  const { data: about, isLoading } = useQuery({
    queryKey: ['about'],
    queryFn: () => aboutApi.get().then((r) => r.data?.data ?? r.data),
  });

  const [form, setForm] = useState({ name: '', tagline: '', bio: '', email: '', location: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const hasProfile = Boolean(about?.name && about?.bio);

  useEffect(() => {
    if (editOpen && about) {
      setForm({
        name: about.name ?? '',
        tagline: about.tagline ?? '',
        bio: about.bio ?? '',
        email: about.email ?? '',
        location: about.location ?? '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [editOpen, about]);

  const updateMutation = useMutation({
    mutationFn: (data) => aboutApi.update(data),
    onSuccess: () => {
      setErrors({});
      qc.invalidateQueries(['about']);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setEditOpen(false);
      }, 1000);
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.bio.trim()) newErrors.bio = 'Bio is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v != null) fd.append(k, v);
    });
    if (photoFile instanceof File) fd.append('photo', photoFile);
    updateMutation.mutate(fd);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={20} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full">
        {/* Page Header */}
        <PageHeader
          icon={UsersRound}
          title="About"
          description="Manage your public profile and biography."
          stats={[{ label: 'Profile', value: hasProfile ? 'Ready' : 'Draft' }]}
          action={{ label: 'Edit Profile', icon: Pencil, onClick: () => setEditOpen(true) }}
        />

        {/* Body */}
        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {/* Profile */}
            <Section title="Profile" description="Your public identity.">
              {about?.name ? (
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                    {about.photo_url ? (
                      <img
                        src={about.photo_url}
                        alt={about.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-white/20">
                        {about.name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white">{about.name}</p>
                    {about.tagline && (
                      <p className="text-sm text-white/40 mt-0.5">{about.tagline}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {about.email && (
                        <span className="flex items-center gap-1.5 text-xs text-white/30">
                          <Mail size={11} /> {about.email}
                        </span>
                      )}
                      {about.location && (
                        <span className="flex items-center gap-1.5 text-xs text-white/30">
                          <MapPin size={11} /> {about.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/20">No profile info yet.</p>
              )}
            </Section>

            {/* Bio */}
            <Section title="Bio" description="Short description about yourself.">
              {about?.bio ? (
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                  {about.bio}
                </p>
              ) : (
                <p className="text-sm text-white/20">No bio written yet.</p>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        description="Changes will be reflected on your public portfolio."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center group"
              onClick={() => photoRef.current.click()}
            >
              {photoPreview || about?.photo_url ? (
                <img
                  src={photoPreview ?? about.photo_url}
                  alt="Photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white/20">
                  {form.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <Camera size={14} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Profile Photo</p>
              <p className="text-xs text-white/30 mt-0.5">JPG, PNG, WEBP — max 2MB</p>
              <button
                type="button"
                onClick={() => photoRef.current.click()}
                className="mt-1.5 text-xs text-white/40 underline hover:text-white/70 transition-colors"
              >
                Change photo
              </button>
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name + Tagline */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className={inputCls}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </Field>
            <Field label="Tagline">
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="Fullstack Developer"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Email + Location */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className={inputCls}
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Jakarta, Indonesia"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Bio */}
          <Field label="Bio" required>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Write a short bio about yourself..."
              className={`${inputCls} resize-none`}
            />
            {errors.bio && <p className="text-xs text-red-400 mt-1">{errors.bio}</p>}
          </Field>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {updateMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]';

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-white/35">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr] py-6 border-b border-white/[0.06] last:border-0">
      <div className="shrink-0">
        <p className="text-sm font-medium text-white/80">{title}</p>
        {description && <p className="mt-1 text-xs leading-relaxed text-white/30">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
