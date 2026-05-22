const API_URL = 'http://localhost:4000/api';

export const fetchMachines = async () => {
  const res = await fetch(`${API_URL}/plc/machines`);
  return res.json();
};

export const triggerAction = async (service: string, action: string, data: any) => {
  const res = await fetch(`${API_URL}/${service}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};
