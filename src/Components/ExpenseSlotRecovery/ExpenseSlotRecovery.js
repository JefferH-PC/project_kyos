import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotRecovery.css';

const ExpenseSlotRecovery = (props) => {
    return (
        <div className={`expense-slot-recovery ${props.position || ''}`}>
            <h3>{props.expenseName} - R$ {props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
            </div>
        </div>
    );
}

export default ExpenseSlotRecovery;