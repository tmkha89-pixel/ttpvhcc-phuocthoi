import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type Counter = {
  id: number;
  name: string;
};

function QueuePage() {
  const navigate = useNavigate();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCounters() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_URL}/general/counters`);
        if (!response.ok) {
          throw new Error('Unable to load counters');
        }

        const data = await response.json();
        setCounters(data.slice(0, 6));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load counters');
      } finally {
        setLoading(false);
      }
    }

    loadCounters();
  }, []);

  function openCustomerModal(counter: Counter) {
    if (creatingId !== null) return;

    setError('');
    setCustomerName('');
    setSelectedCounter(counter);
  }

  function closeCustomerModal() {
    if (creatingId !== null) return;

    setSelectedCounter(null);
    setCustomerName('');
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCounter || !customerName.trim()) return;

    const counter = selectedCounter;

    try {
      setCreatingId(counter.id);
      setError('');

      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterId: counter.id,
          name: customerName.trim(),
          priorityLevel: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Không thể tạo số thứ tự');
      }

      const customer = await response.json();
      navigate('/queue/success', {
        state: {
          customer,
          counterName: counter.name
        }
      });
      setSelectedCounter(null);
      setCustomerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo số thứ tự');
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <div className="queuepage-wrapper">
      <div className="container">
        <div className="header-row">
            <h1>Chọn quầy để lấy số thứ tự</h1>
        </div>

        {loading && <p>ĐANG TẢI…</p>}
        {error && <div className="error">{error}</div>}

        {!loading && (
          <div className="counter-grid" role="list">
            {counters.map((counter) => (
              <div
                key={counter.id}
                className={`counter-card${creatingId === counter.id ? ' is-loading' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => openCustomerModal(counter)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCustomerModal(counter);
                  }
                }}
              >
                <div className="counter-badge">Quầy {counter.id}</div>
                <h2 className='text-center'>{counter.name}</h2>
                {/* <p>{creatingId === counter.id ? 'Creating ticket…' : 'Tap to create a queue number'}</p> */}
              </div>
            ))}
          </div>
        )}

        {selectedCounter && (
          <div className="modal-backdrop" role="presentation" onMouseDown={closeCustomerModal}>
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h2 id="customer-modal-title">Nhập tên</h2>
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close"
                  onClick={closeCustomerModal}
                  disabled={creatingId !== null}
                >
                  ×
                </button>
              </div>

              <p>QUẦY {selectedCounter.id}: {selectedCounter.name}</p>
              <form onSubmit={handleCreateTicket}>
                <label htmlFor="customer-name">Họ và tên</label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nhập họ và tên"
                  autoFocus
                  required
                  disabled={creatingId !== null}
                />
                <div className="button-row modal-actions">
                  <button type="button" className="secondary" onClick={closeCustomerModal} disabled={creatingId !== null}>
                    HỦY
                  </button>
                  <button type="submit" disabled={creatingId !== null || !customerName.trim()}>
                    {creatingId === selectedCounter.id ? 'ĐANG THỰC HIỆN...' : 'HOÀN TẤT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueuePage;
