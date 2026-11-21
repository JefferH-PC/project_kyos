import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import ReturnButton from '../ReturnButton/ReturnButton';
import UpdateButton from '../UpdateButton/UpdateButton';
import './ExpenseSlot.css';

const ROOT_CLASS_BY_VARIANT = {
    ready: 'expense-slot-ready',
    processing: 'expense-slot-processing',
    recovery: 'expense-slot-recovery',
    expense: 'expense-slot'
};

const ExpenseSlot = (props) => {
    const variant = props.variant || 'expense';
    const rootClass = ROOT_CLASS_BY_VARIANT[variant] || 'expense-slot';
    const isReady = variant === 'ready';
    const isProcessing = variant === 'processing';
    const isRecovery = variant === 'recovery';

    const classNames = [
        rootClass,
        props.position || '',
        props.isDragging ? 'is-dragging' : '',
        props.isDragOver ? 'is-drag-over' : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classNames}
            draggable={props.draggable}
            onDragStart={props.onDragStart}
            onDragOver={props.onDragOver}
            onDragLeave={props.onDragLeave}
            onDrop={props.onDrop}
            onDragEnd={props.onDragEnd}
            data-slot-id={props.slotId}
        >
            <div className='slot-info'>
                <div className='slot-title-row'>
                    <strong className='slot-title'>{props.expenseName}</strong>
                    {isReady ? (
                        <span className='slot-days-pill ready'>{props.readyLabel || '✓ 100% Funded'}</span>
                    ) : (
                        <span className={`slot-days-pill ${isProcessing ? 'active' : isRecovery ? 'recovery' : ''}`.trim()}>
                            {props.days === '—' ? '—' : `${props.days} ${props.daysLabel}`}
                        </span>
                    )}
                </div>
                <div className='slot-amount-row'>
                    {isReady ? (
                        <span className='slot-price ready'>R$ {props.originalPrice || props.price}</span>
                    ) : (
                        <>
                            <span className={`slot-price ${isRecovery ? 'recovery' : ''}`.trim()}>R$ {props.price}</span>
                            {props.hasProgress && (
                                <span className='slot-original-price'>R$ {props.originalPrice}</span>
                            )}
                        </>
                    )}
                </div>
                {isReady && (
                    <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow='100' aria-valuemin='0' aria-valuemax='100'>
                        <div className='slot-progress-fill ready' style={{ width: '100%' }}></div>
                    </div>
                )}
                {!isReady && (isProcessing || props.hasProgress) && (
                    <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow={props.progressPercent} aria-valuemin='0' aria-valuemax='100'>
                        <div
                            className={`slot-progress-fill ${isProcessing ? 'processing' : isRecovery ? 'recovery' : ''}`.trim()}
                            style={{ width: `${isProcessing ? Math.max(props.progressPercent, 4) : props.progressPercent}%` }}
                        ></div>
                    </div>
                )}
            </div>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                {variant === 'expense' && (
                    <UpdateButton label={props.updateLabel} onClick={props.onUpdate}></UpdateButton>
                )}
                {isProcessing && (
                    <ReturnButton label={props.returnLabel} onClick={props.onReturn}></ReturnButton>
                )}
                {!isRecovery && (
                    <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
                )}
            </div>
        </div>
    );
};

export default ExpenseSlot;
