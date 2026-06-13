import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMembers } from '../context/MembersContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/ConfirmDialog.jsx';
import { BrandHeader } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Sidebar from '../components/Sidebar.jsx';
import PlanCreateModal from '../components/PlanCreateModal.jsx';
import {
  IconLogout,
  IconUser,
  IconDumbbell,
  IconRupee,
  IconUsers,
  IconTrash,
  IconPlus,
} from '../components/icons.jsx';
import { durationLabel, formatINR } from '../utils/memberUtils.js';

export default function Account() {
  const { user, logout } = useAuth();
  const { stats, plans, addPlan, removePlan } = useMembers();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const handleCreatePlan = async (data) => {
    await addPlan(data);
    showToast(`${data.name} plan created`);
  };

  const handleRemovePlan = async (plan) => {
    const ok = await confirm({
      title: 'Delete plan?',
      body: (
        <>
          Remove the <strong>{plan.name}</strong> plan?
        </>
      ),
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await removePlan(plan.id);
      showToast(`${plan.name} plan removed`);
    } catch (err) {
      showToast(err?.message || 'Could not remove plan');
    }
  };

  return (
    <>
      <Sidebar />
      <BrandHeader />
      <main className="page">
        <div className="greeting">
          <h1>Account</h1>
          <p>Manage your gym profile, plans, and session.</p>
        </div>

        <div className="detail-grid">
          <div className="detail-left">
            <div className="member-hero">
              <div className="avatar accent large">
                {(user?.name || 'GO').slice(0, 2).toUpperCase()}
              </div>
              <h1 className="name" style={{ textTransform: 'capitalize' }}>
                {user?.name || 'Gym Owner'}
              </h1>
              <div className="phone">{user?.email || '—'}</div>
            </div>

            <div className="info-card">
              <div className="info-row">
                <div className="label">
                  <span className="ico">
                    <IconDumbbell size={14} />
                  </span>
                  Gym
                </div>
                <div className="value">{user?.gymName || 'Your Gym'}</div>
              </div>
              <div className="info-row">
                <div className="label">
                  <span className="ico">
                    <IconUser size={14} />
                  </span>
                  Role
                </div>
                <div className="value">Owner</div>
              </div>
              <div className="info-row">
                <div className="label">
                  <span className="ico">
                    <IconUsers size={14} />
                  </span>
                  Members managed
                </div>
                <div className="value">{stats.total}</div>
              </div>
              <div className="info-row">
                <div className="label">
                  <span className="ico">
                    <IconRupee size={14} />
                  </span>
                  Cycle revenue
                </div>
                <div className="value accent">₹{formatINR(stats.revenue)}</div>
              </div>
            </div>
          </div>

          <div className="detail-right">
            {/* ---- Plan management ------------------------------------------- */}
            <div className="plans-card">
              <div className="plans-card-head">
                <div>
                  <div className="plans-card-title">Membership Plans</div>
                  <div className="plans-card-sub">
                    {plans.length} {plans.length === 1 ? 'plan' : 'plans'} active
                  </div>
                </div>
                <button
                  type="button"
                  className="plans-add-btn"
                  onClick={() => setPlanModalOpen(true)}
                  aria-label="Create new plan"
                >
                  <IconPlus size={16} />
                  <span>New plan</span>
                </button>
              </div>

              <div className="plans-list">
                {plans.length === 0 ? (
                  <div className="plans-list-item">
                    <div className="plans-list-main">
                      <div className="plans-list-name">No active plans</div>
                      <div className="plans-list-meta">
                        Members can't be added or renewed until a plan is active.
                      </div>
                    </div>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.id} className="plans-list-item">
                      <div className="plans-list-main">
                        <div className="plans-list-name">{plan.name}</div>
                        <div className="plans-list-meta">
                          {durationLabel(plan.durationMonths)}
                        </div>
                      </div>
                      <div className="plans-list-price">
                        ₹{formatINR(plan.price)}
                      </div>
                      <button
                        type="button"
                        className="plans-list-remove"
                        onClick={() => handleRemovePlan(plan)}
                        aria-label={`Delete ${plan.name} plan`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="action-stack">
              <button
                className="btn-secondary"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                <IconLogout size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />

      <PlanCreateModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onCreate={handleCreatePlan}
      />
    </>
  );
}
