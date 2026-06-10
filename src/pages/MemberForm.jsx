import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { PageHeader } from '../components/Header.jsx';
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
  const { getMember, addMember, updateMember, plans } = useMembers();
  const { showToast } = useToast();

  const existing = isEdit ? getMember(id) : null;
  const defaultPlanId = plans[0]?.id || 'standard';
  const initial = useMemo(
    () => ({
      name: existing?.name || '',
      phone: existing?.phone || '',
      plan: existing?.plan || defaultPlanId,
      paymentDate: existing?.paymentDate || todayIST(),
      photoUrl: existing?.photoUrl || null,
    }),
    [existing, defaultPlanId]
  );

  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const galleryInputRef = useRef(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // End-date preview uses the currently-selected plan's calendar-month
  // duration. Falls back to the first plan's duration if the selection
  // can't be found (e.g. a plan was just deleted).
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === form.plan) || plans[0],
    [plans, form.plan]
  );

  const endDate = useMemo(() => {
    if (!form.paymentDate || !selectedPlan) return '';
    return computeEndDate(form.paymentDate, selectedPlan.durationMonths || 1);
  }, [form.paymentDate, selectedPlan]);

  const valid =
    form.name.trim().length >= 2 &&
    form.phone.trim().length >= 6 &&
    form.paymentDate &&
    plans.some((p) => p.id === form.plan);

  // ---- photo handlers --------------------------------------------------

  // Demo build: no backend. We compress the picked photo on the client,
  // encode it as a data URL, and stash it on the member. The image
  // survives refresh via MembersContext's localStorage layer.
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
      // Smaller maxEdge in the demo build because we're stashing the
      // bytes in localStorage (5MB quota across the whole origin).
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

  return (
    <>
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

            <div className="field">
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

            <div className="field">
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

            <div className="field">
              <label>Plan</label>
              <div className="plan-picker">
                {plans.map((plan) => (
                  <button
                    type="button"
                    key={plan.id}
                    className={`plan-option ${form.plan === plan.id ? 'selected' : ''}`}
                    onClick={() => setField('plan', plan.id)}
                  >
                    <span className="plan-sub">{plan.name}</span>
                    <span className="plan-price">₹{plan.price}</span>
                    <span className="plan-name">
                      per {durationLabel(plan.durationMonths).replace(/^1 /, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

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
