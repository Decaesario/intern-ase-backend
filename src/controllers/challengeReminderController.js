import { sendChallengeReminders } from '../utils/reminderHelper.js';

// GET/POST /api/challenges/reminders - kirim pengingat challenge yang hampir berakhir
export const runChallengeReminders = async (req, res) => {
  try {
    const result = await sendChallengeReminders();
    res.json({ message: 'Pengingat challenge diproses', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
