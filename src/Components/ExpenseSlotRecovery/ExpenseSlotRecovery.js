import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotRecovery.css';

const ExpenseSlotRecovery = (props) => {
    return (
        <div className='expense-slot-recovery'>
            <h3>{props.expenseName} - R${props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton></RemoveButton>
            </div>
        </div>
    );
}

export default ExpenseSlotRecovery;