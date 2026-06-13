import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { PageHeader } from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Avatar from '../components/Avatar.jsx';
import { compressImage } from '../utils/imageUtils.js';
import {
  IconUser,
  IconPhone,
  IconCalendar,
  IconCheck,
  IconSparkle,
  IconImage,
  IconX,
  IconSpinner,
} from '../components/icons.jsx';
import {
  computeEndDate,
  durationLabel,
  formatDate,
  todayIST,
} from '../utils/memberUtils.js';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export default function MemberForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { getMember, addMember, updateMember, plans, loading } = useMembers();
  const { showToast } = useToast();

  const existing = isEdit ? getMember(id) : null;
  const defaultPlanName = plans[0]?.name;

  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const galleryInputRef = useRef(null);

  // The member/plans data loads asynchronously, so don't seed the form
  // until it's arrived — otherwise an edit form mounted before the fetch
  // resolves would lock in empty values forever.
  useEffect(() => {
    if (form) return;
    if (loading) return;
    if (isEdit && !existing) return;
    setForm({
      name: existing?.name || '',
      phone: existing?.phone || '',
      plan: existing?.plan || defaultPlanName,
      paymentDate: existing?.paymentDate || todayIST(),
      photoUrl: existing?.photoUrl || null,
    });
  }, [form, loading, isEdit, existing, defaultPlanName]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // End-date preview uses the currently-selected plan's calendar-month
  // duration. Falls back to the first plan's duration if the selection
  // can't be found (e.g. a plan was just deleted).
  const selectedPlan = useMemo(
    () => (form ? plans.find((p) => p.name === form.plan) || plans[0] : null),
    [plans, form]
  );

  const endDate = useMemo(() => {
    if (!form?.paymentDate || !selectedPlan) return '';
    return computeEndDate(form.paymentDate, selectedPlan.durationMonths || 1);
  }, [form, selectedPlan]);

  const valid =
    !!form &&
    form.name.trim().length >= 2 &&
    form.phone.trim().length >= 6 &&
    form.paymentDate &&
    plans.some((p) => p.name === form.plan);

  // ---- photo handlers --------------------------------------------------

  // The picked photo is compressed client-side and sent as a data URL in
  // the `photo_url` field of the create/update request. To replace a photo
  // on an existing member without re-submitting the whole form, use
  // MemberDetail's avatar upload button instead — that calls
  // POST /api/v1/members/:id/photo (Supabase Storage) directly.
  //
  // Note: `accept="image/*"` on the input means most mobile OSes will
  // surface BOTH gallery and camera as choices in the picker sheet — so
  // users can still capture a fresh photo if they want, without us having
  // to maintain a separate camera flow.
  const handleFileChosen = async (event) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }

    setPhotoError(null);
    setUploading(true);
    try {
      // Keep the encoded payload small since it's sent inline as JSON.
      const optimised = await compressImage(file, {
        maxEdge: 480,
        quality: 0.8,
      });
      const dataUrl = await fileToDataUrl(optimised);
      setField('photoUrl', dataUrl);
    } catch (err) {
      setPhotoError(err?.message || 'Could not process photo.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoError(null);
    // null (rather than undefined) tells the data layer to clear an existing
    // photo on update — matters when editing a member, harmless when adding.
    setField('photoUrl', null);
  };

  // ---- submit ---------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateMember(id, form);
        showToast('Member updated');
        navigate(`/members/${id}`, { replace: true });
      } else {
        const newId = await addMember(form);
        showToast('Member added');
        navigate(`/members/${newId}`, { replace: true });
      }
    } catch (err) {
      showToast(err?.message || 'Could not save member');
      setSubmitting(false);
    }
  };

  if (!form) {
    if (isEdit && !loading && !existing) {
      return (
        <>
          <Sidebar />
          <PageHeader title="Edit Member" />
          <main className="page page-no-nav">
            <div className="empty-state">
              <h3>Member not found</h3>
              <p>This member may have been removed.</p>
              <Link to="/members" className="btn-ghost" style={{ display: 'inline-block', marginTop: 12 }}>
                Back to members
              </Link>
            </div>
          </main>
        </>
      );
    }
    return (
      <>
        <Sidebar />
        <PageHeader title={isEdit ? 'Edit Member' : 'Add Member'} />
        <main className="page page-no-nav">
          <div className="empty-state">
            <h3>Loading…</h3>
            <p>Fetching data from the server.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageHeader title={isEdit ? 'Edit Member' : 'Add Member'} />
      <main className="page page-no-nav form-page">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-card">
            {/* Profile photo picker — optional */}
            <div className="photo-picker">
              <div className="photo-picker-disc">
                <Avatar
                  name={form.name || existing?.name || 'New member'}
                  photoUrl={form.photoUrl}
                  className="accent"
                />
                {uploading && (
                  <div className="uploading-overlay">
                    <IconSpinner size={22} className="spin" />
                  </div>
                )}
                {form.photoUrl && !uploading && (
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>

              <div className="photo-picker-actions">
                <button
                  type="button"
                  className="photo-btn"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading || submitting}
                >
                  <IconImage size={16} />
                  Choose Photo
                </button>
              </div>

              {/* Hidden input — button above triggers it */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChosen}
                style={{ display: 'none' }}
              />

              {photoError ? (
                <div className="photo-picker-error">{photoError}</div>
              ) : (
                <div className="photo-picker-hint">
                  Profile photo is optional · JPEG / PNG / WEBP
                </div>
              )}
            </div>

            <div className="field field-name">
              <label htmlFor="name">Full name</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <IconUser size={18} />
                </span>
                <input
                  id="name"
                  className="input"
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="field field-phone">
              <label htmlFor="phone">Phone number</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <IconPhone size={18} />
                </span>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  placeholder="+91 98000 12345"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="field field-plan">
              <label>Plan</label>
              {plans.length === 0 ? (
                <div className="photo-picker-error">
                  No active plans. Re-enable a plan from Account before adding members.
                </div>
              ) : (
                <div className="plan-picker">
                  {plans.map((plan) => (
                    <button
                      type="button"
                      key={plan.id}
                      className={`plan-option ${form.plan === plan.name ? 'selected' : ''}`}
                      onClick={() => setField('plan', plan.name)}
                    >
                      <span className="plan-sub">{plan.name}</span>
                      <span className="plan-price">₹{plan.price}</span>
                      <span className="plan-name">
                        per {durationLabel(plan.durationMonths).replace(/^1 /, '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="field-date-group">
              <div className="field">
                <label htmlFor="paymentDate">Payment date</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <IconCalendar size={18} />
                  </span>
                  <input
                    id="paymentDate"
                    className="input"
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setField('paymentDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="end-date-callout">
                <span className="ico">
                  <IconSparkle size={18} />
                </span>
                <div>
                  <div className="label">Membership ends</div>
                  <div className="value">{endDate ? formatDate(endDate) : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!valid || submitting || uploading}
          >
            <IconCheck size={18} />
            {submitting
              ? 'Saving…'
              : uploading
                ? 'Waiting for photo…'
                : isEdit
                  ? 'Save changes'
                  : 'Add member'}
          </button>
        </form>
      </main>
    </>
  );
}
