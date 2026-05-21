// import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

interface DummyUser {
  id: number;
  name: string;
  username: string;
  dr_id_number: string;
  email: string;
}

const CorrectionAccount = () => {
  // const { user, isLoading: loading } = useAuth();
  const [user, setUser] = useState<DummyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 text-white items-center">
        <span className="material-symbols-outlined">person</span>
        <div>
          <p>Loading...</p>
          <p>-</p>
        </div>
        <span className="material-symbols-outlined">logout</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex gap-3 text-white items-center">
        <span className="material-symbols-outlined">person</span>
        <div>
          <p>Guest User</p>
          <p>Not logged in</p>
        </div>
        <span className="material-symbols-outlined">logout</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 text-white items-center">
      <span className="material-symbols-outlined">person</span>
      <div>
        <p>{user.name}</p>
        <p>ID: {user.dr_id_number}</p>
      </div>
      <span className="material-symbols-outlined">logout</span>
    </div>
  );
};

export default CorrectionAccount;