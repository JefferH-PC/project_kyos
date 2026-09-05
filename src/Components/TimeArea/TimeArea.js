import { useState } from "react";
import ExpenseSlotReady from "../ExpenseSlotReady/ExpenseSlotReady";
import AddMoreButton from "../AddMoreButton/AddMoreButton";
import ExpenseSlot from "../ExpenseSlot/ExpenseSlot";
import ExpenseSlotProcessing from "../ExpenseSlotProcessing/ExpenseSlotProcessing";
import ExpenseSlotRecovery from "../ExpenseSlotRecovery/ExpenseSlotRecovery";
import "./TimeArea.css";

const TimeArea = (props) => {
    const isRecoveryArea = props.title === 'Recovery';
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenseName, setExpenseName] = useState('');
    const [price, setPrice] = useState('');
    const slots = props.slots || [];

    const addSlot = (event) => {
        event.preventDefault();
        if (!expenseName.trim() || !price) return;

        const newSlot = {
            id: `${Date.now()}-${Math.random()}`,
            type: isRecoveryArea ? 'recovery' : 'expense',
            isProcessing: isRecoveryArea && !slots.some((slot) => slot.type === 'recovery' && slot.isProcessing),
            expenseName: expenseName.trim(),
            price: Number(price)
        };
        props.onSlotsChange([
            ...slots,
            newSlot
        ]);
        setExpenseName('');
        setPrice('');
        setIsFormOpen(false);
    };

    const removeSlot = (id) => {
        const removedSlot = slots.find((slot) => slot.id === id);
        const remainingSlots = slots.filter((slot) => slot.id !== id);
        if (isRecoveryArea && removedSlot?.isProcessing) {
            const nextRecovery = remainingSlots.find((slot) => slot.type === 'recovery');
            props.onSlotsChange(remainingSlots.map((slot) => slot.id === nextRecovery?.id ? { ...slot, isProcessing: true } : slot));
            return;
        }
        props.onSlotsChange(remainingSlots);
    };

    const completeSlot = (id) => {
        removeSlot(id);
    };

    const returnFromProcessing = (id) => {
        if (isRecoveryArea) return;
        props.onSlotsChange(slots.map((slot) => (
            slot.id === id ? { ...slot, type: 'expense' } : slot
        )));
    };

    const moveToProcessing = (id) => {
        if (slots.some((slot) => slot.type === 'processing')) return;
        props.onSlotsChange(slots.map((slot) => slot.id === id ? { ...slot, type: 'processing' } : slot));
    };

    const renderSlot = (slot, index, list) => {
        const position = list.length === 1 ? 'slot-single' : index === 0 ? 'slot-first' : index === list.length - 1 ? 'slot-last' : 'slot-middle';
        const slotProps = {
            key: slot.id,
            expenseName: slot.expenseName,
            price: slot.price,
            position,
            onRemove: () => removeSlot(slot.id),
            onUpdate: () => moveToProcessing(slot.id),
            onBuy: () => completeSlot(slot.id),
            onReturn: () => returnFromProcessing(slot.id)
        };
        if (slot.type === 'ready') return <ExpenseSlotReady {...slotProps}></ExpenseSlotReady>;
        if (slot.type === 'processing') return <ExpenseSlotProcessing {...slotProps}></ExpenseSlotProcessing>;
        if (slot.type === 'recovery') return <ExpenseSlotRecovery {...slotProps}></ExpenseSlotRecovery>;
        return <ExpenseSlot {...slotProps}></ExpenseSlot>;
    };

    const regularSlots = slots.filter((slot) => (
        slot.type !== 'processing' && (!isRecoveryArea || !slot.isProcessing)
    ));
    const processingSlots = slots.filter((slot) => (
        slot.type === 'processing' || (isRecoveryArea && slot.type === 'recovery' && slot.isProcessing)
    ));

    return (
        <div className="time-area">
            <div className="top">
                <h2>{props.title}</h2>
                <AddMoreButton onClick={() => setIsFormOpen((current) => !current)}></AddMoreButton>
            </div>
            {isFormOpen && (
                <form className="expense-form" onSubmit={addSlot}>
                    <input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder="Expense name" aria-label="Expense name" required />
                    <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="R$ value" aria-label="Expense value" type="number" min="0" step="0.01" required />
                    <button type="submit">Add</button>
                </form>
            )}
            <div className="expense-area">
                {regularSlots.map((slot, index, list) => renderSlot(slot, index, list))}
            </div>
            <div className="processing-area">
                {processingSlots.slice(0, isRecoveryArea ? 1 : 1).map((slot, index, list) => renderSlot(slot, index, list))}
            </div>
            <div className="total">
                <h3>Total: R${props.total}</h3>
            </div>
        </div >
    );
}

export default TimeArea;