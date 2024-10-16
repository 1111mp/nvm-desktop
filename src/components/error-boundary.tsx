import { LabelCopyable } from './ui';
import ErrorLogo from '../assets/500.svg';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
	const error = useRouteError() as Error;
	const { t } = useTranslation();

	return (
		<div className='flex flex-col items-center justify-center mt-4'>
			<img className='h-64' src={ErrorLogo} alt='500' />
			<p className='flex items-center gap-2 text-primary text-lg font-medium'>
				<ExclamationTriangleIcon className='text-primary scale-150' />
				{t('Error-500')}
			</p>
			<p className='relative w-2/3 max-h-64 p-3 mt-2 rounded-md [overflow:overlay] text-muted-foreground bg-muted'>
				<LabelCopyable
					rootClassName='absolute top-1 right-1'
					title={error.stack}
				/>
				{error.stack}
			</p>
		</div>
	);
}
