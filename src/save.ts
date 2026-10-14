import { SaveStore } from '@core';
import { defaultSave, type SaveData } from './logic/model';

/** Player progress, autosaved by the framework. Bump version and add a migration if SaveData changes shape. */
export const save = new SaveStore<SaveData>({ key: 'pondpals.save', version: 1, defaults: defaultSave });
