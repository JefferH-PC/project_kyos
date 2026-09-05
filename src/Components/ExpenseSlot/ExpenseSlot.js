import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import UpdateButton from '../UpdateButton/UpdateButton';
import './ExpenseSlot.css';

const ExpenseSlot = (props) => {
    return (
        <div className='expense-slot'>
            <h3>{props.expenseName} - R${props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton></RemoveButton>
                <UpdateButton></UpdateButton>
                <BuyButton></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlot;