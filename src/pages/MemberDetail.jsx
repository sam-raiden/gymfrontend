import { useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/ConfirmDialog.jsx';
import { useUndo } from '../components/UndoSnackbar.jsx';
import { PageHeader } from '../components/Header.jsx';
import { StatusPill, PlanBadge } from '../components/Pills.jsx';
import Avatar from '../components/Avatar.jsx';
import RenewalModal from '../components/RenewalModal.jsx';
import { compressImage } from '../utils/imageUtils.js';
import {
  IconPhone,
  IconCalendar,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconClock,
  IconRupee,
  IconCamera,
  IconSpinner,
} from '../components/icons.jsx';
import {
  formatDate,
  daysRemainingLabel,
  formatINR,
} from '../utils/memberUtils.js';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getMember,
    renewMember,
    removeMember,
    restoreMember,
    restoreReminder,
    uploadMemberPhoto,
    loading,
  } = useMembers();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { showUndo } = useUndo();

  const [renewOpen, setRenewOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const member = getMember(id);

  if (!member) {
    // Initial poll hasn't returned yet — show a minimal shell instead of a
    // "not found" message, which would flash before the data arrives.
    if (loading) {
      return (
        <>
          <PageHeader title="Member" />
          <main className="page page-no-nav">
            <div className="empty-state">
              <h3>Loading…</h3>
              <p>Fetching member details from the server.</p>
            </div>
          </main>
        </>
      );
    }
    return (
      <>
        <PageHeader title="Member" />
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

  // Renew is a multi-decision flow (which plan? cash or gpay? confirm the
  // new expiry?) so it gets its own dedicated modal instead of the generic
  // confirm dialog.
  const handleRenewClick = () => setRenewOpen(true);

  const handleRenewConfirm = async ({ planId, method }) => {
    setRenewOpen(false);

    let renewResult;
    try {
      renewResult = await renewMember(member.id, { method, planId });
    } catch (err) {
      showToast(err?.message || 'Could not renew');
      return;
    }
    if (!renewResult) return;

    const firstName = member.name.split(' ')[0];
    const methodLabel = method === 'gpay' ? 'GPay' : 'Cash';
    showUndo({
      message: `${firstName} renewed · ${methodLabel}`,
      onUndo: async () => {
        try {
          await restoreMember(renewResult.snapshot);
          if (renewResult.reminderWasSent) restoreReminder(member.id);
          showToast('Renewal undone');
        } catch (err) {
          showToast(err?.message || 'Could not undo renewal');
        }
      },
    });
  };

  const handlePhotoChosen = async (event) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const optimised = await compressImage(file);
      await uploadMemberPhoto(member.id, optimised);
    } catch (err) {
      showToast(err?.message || 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete member?',
      body: (
        <>
          Delete <strong>{member.name}</strong>? This can't be undone after
          the timer ends.
        </>
      ),
      confirmLabel: 'Delete',
      icon: <IconTrash size={20} />,
      tone: 'danger',
    });
    if (!ok) return;

    let captured;
    try {
      captured = await removeMember(member.id);
    } catch (err) {
      showToast(err?.message || 'Could not delete member');
      return;
    }
    const firstName = member.name.split(' ')[0];
    navigate('/members', { replace: true });

    if (!captured) return;
    showUndo({
      message: `${firstName} removed`,
      onUndo: async () => {
        try {
          await restoreMember(captured.snapshot);
          showToast('Member restored');
        } catch (err) {
          showToast(err?.message || 'Could not restore member');
        }
      },
    });
  };

  return (
    <>
      <PageHeader title="Member Details" />
      <main className="page page-no-nav">
        <div className="member-hero">
          <div className="avatar-upload-wrap">
            <Avatar
              name={member.name}
              photoUrl={member.photoUrl}
              className="accent large"
            />
            {uploadingPhoto && (
              <div className="avatar-uploading-overlay">
                <IconSpinner size={22} className="spin" />
              </div>
            )}
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              aria-label="Change photo"
            >
              <IconCamera size={14} />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChosen}
              style={{ display: 'none' }}
            />
          </div>
          <h1 className="name">{member.name}</h1>
          <div className="phone">{member.phone}</div>
          <StatusPill status={member.status} />
        </div>

        <div className="info-card">
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconClock size={14} />
              </span>
              Days remaining
            </div>
            <div className={`value ${member.status === 'expired' ? '' : 'accent'}`}>
              {daysRemainingLabel(member.daysRemaining)}
            </div>
          </div>
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconRupee size={14} />
              </span>
              Plan
            </div>
            <div className="value">
              <PlanBadge planName={member.plan} price={member.planInfo.price} />
            </div>
          </div>
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconCalendar size={14} />
              </span>
              Last payment
            </div>
            <div className="value">{formatDate(member.paymentDate)}</div>
          </div>
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconCalendar size={14} />
              </span>
              Ends on
            </div>
            <div className="value">{formatDate(member.endDate)}</div>
          </div>
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconPhone size={14} />
              </span>
              Joined
            </div>
            <div className="value">{formatDate(member.joinedOn)}</div>
          </div>
          <div className="info-row">
            <div className="label">
              <span className="ico">
                <IconRupee size={14} />
              </span>
              Monthly value
            </div>
            <div className="value">₹{formatINR(member.planInfo.price)}</div>
          </div>
        </div>

        <div className="action-stack">
          <button className="btn-primary" onClick={handleRenewClick}>
            <IconRefresh size={18} />
            Renew for Next Month
          </button>
          <Link to={`/members/${member.id}/edit`} className="btn-secondary">
            <IconEdit size={16} />
            Edit details
          </Link>
          <button className="btn-danger-ghost" onClick={handleDelete}>
            <IconTrash size={14} />
            Remove member
          </button>
        </div>
      </main>

      <RenewalModal
        isOpen={renewOpen}
        member={member}
        onClose={() => setRenewOpen(false)}
        onConfirm={handleRenewConfirm}
      />
    </>
  );
}
