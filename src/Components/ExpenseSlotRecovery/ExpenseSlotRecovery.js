import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotRecovery.css';

const ExpenseSlotRecovery = (props) => {
    return (
        <div className={`expense-slot-recovery ${props.position || ''}`}>
            <div className='slot-info'>
                <div className='slot-title-row'>
                    <strong className='slot-title'>{props.expenseName}</strong>
                    <span className='slot-days-pill recovery'>{props.days === '—' ? '—' : `${props.days} ${props.daysLabel}`}</span>
                </div>
                <div className='slot-amount-row'>
                    <span className='slot-price recovery'>R$ {props.price}</span>
                    {props.hasProgress && (
                        <span className='slot-original-price'>R$ {props.originalPrice}</span>
                    )}
                </div>
                {props.hasProgress && (
                    <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow={props.progressPercent} aria-valuemin='0' aria-valuemax='100'>
                        <div className='slot-progress-fill recovery' style={{ width: `${props.progressPercent}%` }}></div>
                    </div>
                )}
            </div>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
            </div>
        </div>
    );
}

export default ExpenseSlotRecovery;