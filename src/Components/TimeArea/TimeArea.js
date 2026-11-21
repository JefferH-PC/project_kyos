import { useState } from "react";
import AddMoreButton from "../AddMoreButton/AddMoreButton";
import ExpenseSlot from "../ExpenseSlot/ExpenseSlot";
import { formatMoney } from '../../utils/formatters';
import "./TimeArea.css";

const TimeArea = (props) => {
    const isRecoveryArea = props.area === 'recovery';
    const areValuesVisible = props.areValuesVisible !== false;
    const displayMoney = (val) => areValuesVisible ? formatMoney(val) : '****';
    const labels = props.labels || {
        add: 'Add',
        expenseName: 'Expense name',
        expenseValue: 'Expense value',
        total: 'Total',
        days: 'days',
        noItems: 'No items'
    };
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenseName, setExpenseName] = useState('');
    const [price, setPrice] = useState('');
    const [draggedSlotId, setDraggedSlotId] = useState(null);
    const [dragOverSlotId, setDragOverSlotId] = useState(null);

    const slots = props.slots || [];
    const getDays = (amount) => props.dailyIncome > 0 ? Math.ceil(Number(amount || 0) / props.dailyIncome) : '—';

    const addSlot = (event) => {
        event.preventDefault();
        if (!expenseName.trim() || !price) return;

        const slotPrice = Number(price);
        const newSlot = {
            id: `${Date.now()}-${Math.random()}`,
            type: isRecoveryArea ? 'recovery' : 'expense',
            isProcessing: isRecoveryArea && !slots.some((slot) => slot.type === 'recovery' && slot.isProcessing),
            expenseName: expenseName.trim(),
            price: slotPrice,
            originalPrice: slotPrice
        };
        if (isRecoveryArea) {
            props.onAdd?.(slotPrice);
        }
        props.onSlotsChange([
            ...slots,
            newSlot
        ]);
        setExpenseName('');
        setPrice('');
        setIsFormOpen(false);
    };

    const removeSlot = (id, isManualRemoval = true) => {
        const removedSlot = slots.find((slot) => slot.id === id);
        const remainingSlots = slots.filter((slot) => slot.id !== id);
        if (isRecoveryArea && removedSlot && isManualRemoval) {
            props.onRemove?.(removedSlot.price ?? removedSlot.originalPrice);
        }
        if (isRecoveryArea && removedSlot?.isProcessing) {
            const nextRecovery = remainingSlots.find((slot) => slot.type === 'recovery');
            props.onSlotsChange(remainingSlots.map((slot) => slot.id === nextRecovery?.id ? { ...slot, isProcessing: true } : slot));
            return;
        }
        props.onSlotsChange(remainingSlots);
    };

    const completeSlot = (id) => {
        removeSlot(id, false);
    };

    const buySlot = (slot) => {
        const chargedAmount = Number(slot.originalPrice ?? slot.price ?? 0);
        props.onBuy?.(chargedAmount, slot);
        completeSlot(slot.id);
    };

    const returnFromProcessing = (id) => {
        if (isRecoveryArea) return;
        props.onSlotsChange(slots.map((slot) => (
            slot.id === id ? { ...slot, type: 'expense' } : slot
        )));
    };

    const moveToProcessing = (id) => {
        if (slots.some((slot) => slot.type === 'processing')) return;
        if (isRecoveryArea && props.hasWishlistProcessing) return;
        if (!isRecoveryArea && props.hasRecoveryProcessing) return;
        props.onSlotsChange(slots.map((slot) => slot.id === id ? { ...slot, type: 'processing' } : slot));
    };

    const handleDragStart = (event, slotId) => {
        setDraggedSlotId(slotId);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            try {
                event.dataTransfer.setData('text/plain', slotId);
            } catch {
                // Ignore in test environments where dataTransfer.setData may not be needed
            }
        }
    };

    const handleDragOver = (event, slotId) => {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        if (slotId !== draggedSlotId && dragOverSlotId !== slotId) {
            setDragOverSlotId(slotId);
        }
    };

    const handleDragLeave = (slotId) => {
        if (dragOverSlotId === slotId) {
            setDragOverSlotId(null);
        }
    };

    const handleDrop = (event, targetSlotId) => {
        event.preventDefault();
        const sourceId = draggedSlotId || (event.dataTransfer && event.dataTransfer.getData('text/plain'));
        setDraggedSlotId(null);
        setDragOverSlotId(null);

        if (!sourceId || sourceId === targetSlotId) return;

        const sourceIndex = slots.findIndex((s) => s.id === sourceId);
        const targetIndex = slots.findIndex((s) => s.id === targetSlotId);
        if (sourceIndex === -1 || targetIndex === -1) return;

        const nextSlots = [...slots];
        const sourceSlot = { ...nextSlots[sourceIndex] };
        const targetSlot = { ...nextSlots[targetIndex] };

        if (isRecoveryArea) {
            if (targetSlot.isProcessing && !sourceSlot.isProcessing) {
                sourceSlot.isProcessing = true;
                targetSlot.isProcessing = false;
                nextSlots[targetIndex] = targetSlot;
            } else if (sourceSlot.isProcessing && !targetSlot.isProcessing) {
                sourceSlot.isProcessing = false;
                targetSlot.isProcessing = true;
                nextSlots[targetIndex] = targetSlot;
            }
        } else {
            if (targetSlot.type === 'processing' && sourceSlot.type === 'expense') {
                sourceSlot.type = 'processing';
                targetSlot.type = 'expense';
                nextSlots[targetIndex] = targetSlot;
            } else if (sourceSlot.type === 'processing' && targetSlot.type === 'expense') {
                sourceSlot.type = 'expense';
                targetSlot.type = 'processing';
                nextSlots[targetIndex] = targetSlot;
            }
        }

        nextSlots.splice(sourceIndex, 1);
        nextSlots.splice(targetIndex, 0, sourceSlot);
        props.onSlotsChange(nextSlots);
    };

    const handleDragEnd = () => {
        setDraggedSlotId(null);
        setDragOverSlotId(null);
    };

    const renderSlot = (slot, index, list) => {
        const position = list.length === 1 ? 'slot-single' : index === 0 ? 'slot-first' : index === list.length - 1 ? 'slot-last' : 'slot-middle';
        const origPrice = Number(slot.originalPrice ?? slot.price ?? 0);
        const currentPrice = Number(slot.price ?? 0);
        const fundedAmount = Math.max(0, origPrice - currentPrice);
        const progressPercent = origPrice > 0 ? Math.min(100, Math.round((fundedAmount / origPrice) * 100)) : 100;

        let variant = 'expense';
        if (slot.type === 'ready') variant = 'ready';
        else if (slot.type === 'processing') variant = 'processing';
        else if (slot.type === 'recovery') variant = 'recovery';

        const slotProps = {
            slotId: slot.id,
            variant,
            expenseName: slot.expenseName,
            price: displayMoney(slot.price),
            originalPrice: displayMoney(origPrice),
            days: getDays(slot.price),
            daysLabel: labels.days,
            readyLabel: labels.readyLabel,
            progressPercent,
            hasProgress: origPrice > currentPrice && currentPrice > 0,
            position,
            removeLabel: labels.removeSlot,
            buyLabel: labels.completeSlot,
            updateLabel: labels.moveToProcessing,
            returnLabel: labels.returnSlot,
            onRemove: () => removeSlot(slot.id),
            onUpdate: () => moveToProcessing(slot.id),
            onBuy: () => buySlot(slot),
            onReturn: () => returnFromProcessing(slot.id),
            draggable: true,
            isDragging: draggedSlotId === slot.id,
            isDragOver: dragOverSlotId === slot.id,
            onDragStart: (e) => handleDragStart(e, slot.id),
            onDragOver: (e) => handleDragOver(e, slot.id),
            onDragLeave: () => handleDragLeave(slot.id),
            onDrop: (e) => handleDrop(e, slot.id),
            onDragEnd: handleDragEnd
        };

        return <ExpenseSlot key={slot.id} {...slotProps} />;
    };

    const regularSlots = slots.filter((slot) => (
        slot.type !== 'processing' && (!isRecoveryArea || !slot.isProcessing)
    ));
    const processingSlots = slots.filter((slot) => (
        slot.type === 'processing' || (isRecoveryArea && slot.type === 'recovery' && slot.isProcessing)
    ));

    return (
        <div className={`time-area area-${props.area || ''}`}>
            <div className="top">
                <h2>{props.title}</h2>
                <AddMoreButton label={labels.add} onClick={() => setIsFormOpen((current) => !current)}></AddMoreButton>
            </div>
            {isFormOpen && (
                <form className="expense-form" onSubmit={addSlot}>
                    <input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder={labels.expenseName} aria-label={labels.expenseName} required />
                    <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder={'R$ ' + labels.expenseValue.toLowerCase()} aria-label={labels.expenseValue} type="number" min="0" step="0.01" required />
                    <button type="submit">{labels.add}</button>
                </form>
            )}
            <div className="expense-area">
                {slots.length === 0 ? (
                    <div className="time-area-empty">
                        <span>{labels.noItems || 'No items'}</span>
                    </div>
                ) : (
                    regularSlots.map((slot, index, list) => renderSlot(slot, index, list))
                )}
            </div>
            <div className="processing-area">
                {processingSlots.slice(0, 1).map((slot, index, list) => renderSlot(slot, index, list))}
            </div>
            <div className="total">
                <h3>{labels.total}: R$ {displayMoney(props.total)} - {getDays(props.total) === '—' ? '—' : `${getDays(props.total)} ${labels.days}`}</h3>
            </div>
        </div >
    );
}

export default TimeArea;
