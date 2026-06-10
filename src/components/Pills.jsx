import { getPlan } from '../utils/memberUtils.js';

const STATUS_LABEL = {
  active: 'Active',
  expiring: 'Expiring',
  expired: 'Expired',
};

export function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{STATUS_LABEL[status]}</span>;
}

export function PlanBadge({ planId, withPrice = true }) {
  const plan = getPlan(planId);
  const isWeightLoss = planId === 'weightLoss';
  return (
    <span className={`plan-badge ${isWeightLoss ? 'weight-loss' : ''}`}>
      {plan.name}
      {withPrice && (
        <>
          {' '}
          · ₹{plan.price}
        </>
      )}
    </span>
  );
}
