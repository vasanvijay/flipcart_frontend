import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Payment from './Main';

jest.mock('react-qr-code', () => ({ value }) => (
    <div data-testid="qr-code">{value}</div>
));

const paymentConfig = {
    upiId: 'default@upi',
    merchantName: 'Test Store',
    methodUpiIds: {
        phonepe: 'phonepe@upi',
        gpay: 'gpay@upi',
        paytm: 'paytm@upi',
        bhim: 'bhim@upi'
    }
};

const renderPayment = (config = paymentConfig) => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => config
    });

    return render(
        <MemoryRouter initialEntries={[{ pathname: '/payment', state: { totalAmount: 250 } }]}>
            <Payment />
        </MemoryRouter>
    );
};

const setDesktop = (matches) => {
    window.matchMedia = jest.fn().mockReturnValue({ matches });
};

describe('Payment UPI method behavior', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('switches desktop QR values while preserving the payment amount', async () => {
        setDesktop(true);
        renderPayment();

        const qrCode = await screen.findByTestId('qr-code');
        expect(qrCode).toHaveTextContent('pa=default@upi');
        expect(qrCode).toHaveTextContent('am=250');

        for (const [label, upiId] of [
            ['Pay with PhonePe', 'phonepe@upi'],
            ['Pay with Google Pay', 'gpay@upi'],
            ['Pay with Paytm', 'paytm@upi'],
            ['Pay with BHIM or another UPI app', 'bhim@upi']
        ]) {
            fireEvent.click(screen.getByLabelText(label));
            expect(qrCode).toHaveTextContent(`pa=${upiId}`);
            expect(qrCode).toHaveTextContent('am=250');
        }
    });

    test('falls back to the default QR when a method-specific VPA is missing', async () => {
        setDesktop(true);
        renderPayment({
            ...paymentConfig,
            methodUpiIds: { ...paymentConfig.methodUpiIds, gpay: '' }
        });

        await screen.findByTestId('qr-code');
        fireEvent.click(screen.getByLabelText('Pay with Google Pay'));

        expect(screen.getByTestId('qr-code')).toHaveTextContent('pa=default@upi');
    });

    test('keeps the existing mobile app deep-link schemes and default VPA', async () => {
        setDesktop(false);
        renderPayment();

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        expect(await screen.findByLabelText('Pay with PhonePe')).toHaveAttribute('href', expect.stringContaining('phonepe://pay?pa=default@upi'));
        expect(screen.getByLabelText('Pay with Google Pay')).toHaveAttribute('href', expect.stringContaining('tez://upi/pay?pa=default@upi'));
        expect(screen.getByLabelText('Pay with Paytm')).toHaveAttribute('href', expect.stringContaining('paytmmp://pay?pa=default@upi'));
        expect(screen.getByLabelText('Pay with BHIM or another UPI app')).toHaveAttribute('href', expect.stringContaining('upi://pay?pa=default@upi'));
    });

    test('starts with the default QR again after remounting', async () => {
        setDesktop(true);
        const firstRender = renderPayment();

        await screen.findByTestId('qr-code');
        fireEvent.click(screen.getByLabelText('Pay with PhonePe'));
        expect(screen.getByTestId('qr-code')).toHaveTextContent('pa=phonepe@upi');

        firstRender.unmount();
        renderPayment();

        expect(await screen.findByTestId('qr-code')).toHaveTextContent('pa=default@upi');
    });
});
