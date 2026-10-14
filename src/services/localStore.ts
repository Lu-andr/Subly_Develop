import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trial, NotificationPreferences } from '../types';
const KEY = 'subly.local-data.v1';
export const LOCAL_USER_ID = 'this-device';
interface LocalData { version: 1; trials: Trial[]; preferences: NotificationPreferences | null }
let queue: Promise<unknown> = Promise.resolve();
async function read(): Promise<LocalData> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { version: 1, trials: [], preferences: null };
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.trials)) throw new Error('Stored data could not be read.');
  return data;
}
export async function readLocalData(): Promise<LocalData> { await queue.catch(() => {}); return read(); }
export function updateLocalData<T>(update: (data: LocalData) => T): Promise<T> {
  const task = queue.catch(() => {}).then(async () => {
    const data = await read();
    const result = update(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    return result;
  });
  queue = task;
  return task;
}
export function clearLocalData(): Promise<void> {
  return updateLocalData((data) => { data.trials = []; data.preferences = null; });
}
