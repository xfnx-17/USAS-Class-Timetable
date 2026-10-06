import type { StudentSession, WaktuSolatApiResponse } from '@/shared/types/usas';

export async function fetchPrayerTimesAPI(_session: StudentSession | null, zoneCode: string = 'PRK02'): Promise<{ success: boolean; data?: WaktuSolatApiResponse; location: string }> {
  try {
    const res = await fetch(`https://api.waktusolat.app/v2/solat/${zoneCode}`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    const data = await res.json();
    return {
      success: true,
      data,
      location: data.zone || zoneCode,
    };
  } catch (err) {
    return {
      success: false,
      location: 'Kuala Kangsar (PRK02)',
    };
  }
}
