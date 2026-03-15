import type { Meta, StoryObj } from '@storybook/react';
import { Overlay } from './Overlay';

const meta: Meta<typeof Overlay> = {
  title: 'Molecules/Overlay',
  component: Overlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Overlay>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Terms of Service',
    children: 'Please read our terms carefully before proceeding.',
    onClose: () => {},
  },
};
