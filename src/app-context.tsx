import {
	createContext,
	startTransition,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react';

import { useTranslation } from 'react-i18next';
import { applyTheme } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import { updateSettings } from '@/services/cmds';

import { SystemTheme, Themes } from '@/types';

type AppContextType = {
	color: string;
	settings: Nvmd.Setting;
	setColor: (color: string) => void;
	onUpdateSetting: (setting: Nvmd.Setting) => Promise<void>;
};

enum Actions {
	ThemeChanged = 'THEME_CHANGED',
	UpdateSetting = 'UPDATE_SETTING',
}

type StateAction = {
	type: Actions;
	payload: Partial<Nvmd.Setting>;
};

type ReplacementValuesType = {
	[key: string]: string | number;
};

export type I18nFn = (
	key: string,
	substitutions?: Array<string | number> | ReplacementValuesType
) => string;

export const AppProviderContext = createContext<AppContextType | null>(null);

export function AppProvider({
	defaultColor = 'orange',
	settings: defaultSettings,
	sysTheme: defaultSysTheme,
	storageKey = 'nvmd-ui-theme',
	children,
}: {
	defaultColor?: string;
	settings: Nvmd.Setting;
	sysTheme: SystemTheme;
	storageKey?: string;
	children?: React.ReactNode;
}) {
	const [color, setColor] = useState<string>(
		() => localStorage.getItem(storageKey) || defaultColor
	);

	const [settings, dispatch] = useReducer(
		(state: Nvmd.Setting, action: StateAction) => {
			switch (action.type) {
				case Actions.ThemeChanged: {
					return { ...state, ...action.payload };
				}
				case Actions.UpdateSetting: {
					return { ...state, ...action.payload };
				}
				default:
					return state;
			}
		},
		defaultSettings
	);

	const sysTheme = useRef<SystemTheme>(defaultSysTheme);
	const { i18n } = useTranslation();

	// theme
	useEffect(() => {
		const theme = settings.theme;
		if (theme !== Themes.System) {
			applyTheme(theme);
			return;
		}

		const webviewWindow = getCurrent();
		sysTheme.current && applyTheme(sysTheme.current);
		const listener = webviewWindow.onThemeChanged((e) => {
			const theme = e.payload as SystemTheme;
			sysTheme.current = theme;
			applyTheme(theme);
		});

		return () => {
			listener.then((fn) => fn());
		};
	}, [settings.theme]);

	useEffect(() => {
		i18n.changeLanguage(settings.locale);
	}, [settings.locale]);

	// color
	useEffect(() => {
		document.body.classList.forEach((className) => {
			if (className.match(/^theme.*/)) {
				document.body.classList.remove(className);
			}
		});

		if (color) {
			return document.body.classList.add(`theme-${color}`);
		}
	}, [color]);

	// update setting
	const onUpdateSetting = useMemo(
		() => async (setting: Nvmd.Setting) => {
			updateSettings(setting);
			// await window.Context.updateSettingData(setting);

			dispatch({
				type: Actions.UpdateSetting,
				payload: { ...settings, ...setting },
			});
		},
		[
			settings.locale,
			settings.theme,
			settings.directory,
			settings.mirror,
			settings.proxy,
		]
	);

	const setColorHandler = useMemo(
		() => (newColor: string) => {
			localStorage.setItem(storageKey, newColor);
			startTransition(() => {
				setColor(newColor);
			});
		},
		[]
	);

	return (
		<AppProviderContext.Provider
			value={{
				color,
				settings,
				setColor: setColorHandler,
				onUpdateSetting,
			}}
		>
			{children}
		</AppProviderContext.Provider>
	);
}

export function useAppContext() {
	const context = useContext(AppProviderContext);
	if (!context) {
		// this is especially useful in TypeScript so you don't need to be checking for null all the time
		throw new Error(
			'You have forgot to use AppContext.Provider, shame on you.'
		);
	}
	return context;
}
