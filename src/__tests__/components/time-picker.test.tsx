import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePicker } from '../../components/appointments/time-picker';

describe('TimePicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TimePicker value="09:00" onChange={mockOnChange} />);

    // Check if the button with the time is rendered
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('opens popover when clicked', () => {
    render(<TimePicker value="09:00" onChange={mockOnChange} />);

    // Click the button to open the popover
    fireEvent.click(screen.getByRole('button'));

    // Check if the popover content is visible
    expect(screen.getByPlaceholderText('appointments.timePicker.timeFormat')).toBeInTheDocument();
    expect(screen.getByText('appointments.timePicker.businessHours')).toBeInTheDocument();
  });

  it('calls onChange when a time is selected', () => {
    render(<TimePicker value="09:00" onChange={mockOnChange} />);

    // Open the popover
    fireEvent.click(screen.getByRole('button'));

    // Click on a time slot (10:00)
    const timeSlots = screen.getAllByRole('button');
    const tenAMSlot = timeSlots.find(slot => slot.textContent === '10:00');

    if (tenAMSlot) {
      fireEvent.click(tenAMSlot);
      expect(mockOnChange).toHaveBeenCalledWith('10:00');
    } else {
      throw new Error('10:00 time slot not found');
    }
  });

  it('disables time slots based on disabledSlots prop', () => {
    const disabledSlots = ['09:00', '09:30', '10:00'];

    render(
      <TimePicker
        value="08:30"
        onChange={mockOnChange}
        disabledSlots={disabledSlots}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole('button'));

    // Find all time slot buttons
    const timeSlots = screen.getAllByRole('button').filter(
      button => button.textContent && ['08:30', '09:00', '09:30', '10:00'].includes(button.textContent)
    );

    // The 08:30 slot should be enabled
    const eightThirtySlot = timeSlots.find(slot => slot.textContent === '08:30');
    expect(eightThirtySlot).not.toHaveAttribute('disabled');

    // The 09:00, 09:30, and 10:00 slots should be disabled
    const nineAMSlot = timeSlots.find(slot => slot.textContent === '09:00');
    const nineThirtySlot = timeSlots.find(slot => slot.textContent === '09:30');
    const tenAMSlot = timeSlots.find(slot => slot.textContent === '10:00');

    expect(nineAMSlot).toHaveAttribute('disabled');
    expect(nineThirtySlot).toHaveAttribute('disabled');
    expect(tenAMSlot).toHaveAttribute('disabled');
  });

  it('respects duration when disabling time slots', () => {
    const disabledSlots = ['10:30'];
    const duration = 60; // 60 minutes

    render(
      <TimePicker
        value="09:00"
        onChange={mockOnChange}
        disabledSlots={disabledSlots}
        duration={duration}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole('button'));

    // Find all time slot buttons
    const timeSlots = screen.getAllByRole('button').filter(
      button => button.textContent && ['09:00', '10:00', '10:30', '11:00'].includes(button.textContent)
    );

    // The 10:00 slot should be disabled because it would overlap with 10:30 (which is disabled)
    // given the 60-minute duration
    const tenAMSlot = timeSlots.find(slot => slot.textContent === '10:00');
    expect(tenAMSlot).toHaveAttribute('disabled');

    // The 09:00 slot should be enabled
    const nineAMSlot = timeSlots.find(slot => slot.textContent === '09:00');
    expect(nineAMSlot).not.toHaveAttribute('disabled');
  });
});
