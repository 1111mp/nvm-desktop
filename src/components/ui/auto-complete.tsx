import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  type ComboboxInputProps,
} from '@/components/ui';
import { useState } from 'react';

type AutoCompleteProps = ComboboxInputProps & {
  value?: string;
  items?: GroupItem[];
  onChange?: (value: string) => void;
};

type GroupItem = {
  value: string;
  items: string[];
};

function AutoComplete({
  value: valueProp,
  items = [],
  onChange,
  ...props
}: AutoCompleteProps) {
  const [value, setValue] = useState<string>(() => valueProp ?? '');

  return (
    <Combobox
      items={items}
      value={value}
      filter={() => true}
      onValueChange={(value) => {
        const newValue = value ?? '';
        setValue(newValue);
        onChange?.(newValue);
      }}
    >
      <ComboboxInput
        {...props}
        onChange={(evt) => {
          const newValue = evt.target.value;
          setValue(newValue);
          onChange?.(newValue);
        }}
      />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(group: GroupItem, index) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
              {index < items.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export { AutoComplete };
