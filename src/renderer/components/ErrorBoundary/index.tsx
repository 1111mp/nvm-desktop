import { Result } from 'antd';
import { useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
  let error = useRouteError();

  return (
    <Result
      status="error"
      title="Sorry, something went wrong."
      subTitle={(error as any).message}
      style={{marginTop: 100}}
    />
  );
}
