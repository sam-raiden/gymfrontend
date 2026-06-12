const STATUS_LABEL = {
  active: 'Active',
  expiring: 'Expiring',
  expired: 'Expired',
};

export function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{STATUS_LABEL[status]}</span>;
}

export function PlanBadge({ planName, price, withPrice = true }) {
  const isWeightLoss = planName === 'Weight Loss';
  return (
    <span className={`plan-badge ${isWeightLoss ? 'weight-loss' : ''}`}>
      {planName}
      {withPrice && price != null && (
        <>
          {' '}
          · ₹{price}
        </>
      )}
    </span>
  );
}
