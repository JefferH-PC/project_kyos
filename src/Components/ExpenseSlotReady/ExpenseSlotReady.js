
import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotReady.css';

const ExpenseSlotReady = (props) => {
    return (
        <div className='expense-slot-ready'>
            <h3>{props.expenseName} - R${props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton></RemoveButton>
                <BuyButton></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotReady;