import { Switch } from '@headlessui/react';

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ label, description, enabled, onChange }: ToggleProps) {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <Switch.Label className="text-sm font-medium text-gray-700">{label}</Switch.Label>
          <Switch.Description className="text-sm text-gray-500">{description}</Switch.Description>
        </div>
        <Switch
          checked={enabled}
          onChange={onChange}
          className={`${
            enabled ? 'bg-portal-purple' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-portal-purple focus:ring-offset-2`}
        >
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
}

export default Toggle;