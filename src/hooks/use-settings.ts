import { useReducer } from 'react';
import { updateSettings } from '@/services/cmds';

enum Actions {
  UpdateSetting = 'UPDATE_SETTING',
}

type DispatchAction = {
  type: Actions;
  payload: Partial<Nvmd.Setting>;
};

function settingsReducer(
  state: Nvmd.Setting,
  action: DispatchAction,
): Nvmd.Setting {
  switch (action.type) {
    case Actions.UpdateSetting: {
      return {
        ...state,
        ...action.payload,
      };
    }
    default: {
      return { ...state };
    }
  }
}

export function useSettings(defaultSettings: Nvmd.Setting) {
  const [settings, dispatch] = useReducer(settingsReducer, {
    ...defaultSettings,
  });

  // update setting
  const updateSetting = async (setting: Nvmd.Setting) => {
    dispatch({
      type: Actions.UpdateSetting,
      payload: { ...setting },
    });
    await updateSettings(setting);
  };

  return {
    settings,
    updateSetting,
  };
}
