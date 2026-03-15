import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'Molecules/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {
    columns: [
      { header: 'Ticket ID', accessor: (d: any) => d.id },
      { header: 'Status', accessor: (d: any) => d.status },
      { header: 'Last Update', accessor: (d: any) => d.updated },
    ],
    data: ([
      { id: '#3902', status: 'Open', updated: '2 mins ago' },
      { id: '#3851', status: 'In Progress', updated: '1 hour ago' },
      { id: '#3842', status: 'Resolved', updated: 'Yesterday' },
    ] as any[]),
  },
};
