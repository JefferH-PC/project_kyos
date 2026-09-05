import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import ReturnButton from '../ReturnButton/ReturnButton';
import './ExpenseSlotProcessing.css';

const ExpenseSlotProcessing = (props) => {
    return (
        <div className='expense-slot-processing'>
            <h3>{props.expenseName} - R${props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton></RemoveButton>
                <ReturnButton></ReturnButton>
                <BuyButton></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotProcessing;