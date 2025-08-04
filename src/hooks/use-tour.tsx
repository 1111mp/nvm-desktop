import { useEffect, useRef, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import introJs from 'intro.js';

import type { Tour } from 'intro.js/src/packages/tour';
import type { TourOptions } from 'intro.js/src/packages/tour/option';
import type { TourStep } from 'intro.js/src/packages/tour/steps';

type Options = Partial<Omit<TourOptions, 'steps'>> & {
  steps?: Array<
    Partial<Omit<TourStep, 'intro'>> & { intro?: string | React.ReactNode }
  >;
};

export function useTour(options: Options) {
  const tour = useRef<Tour>(null);
  const optionsRef = useRef<Options>(options);

  optionsRef.current = options;

  useEffect(() => {
    const { steps = [], ...options } = optionsRef.current;
    const instance = introJs.tour().setOptions({
      ...options,
      steps: steps?.map((step) => {
        return {
          ...step,
          intro: isValidElement(step.intro)
            ? renderToStaticMarkup(step.intro)
            : (step.intro as string),
        };
      }),
    });

    instance.onExit(() => {
      localStorage.setItem('nvmd-first', 'no');
    });

    tour.current = instance;

    if (localStorage.getItem('nvmd-first') === null) {
      tour.current?.start();
    }
  }, []);
}
