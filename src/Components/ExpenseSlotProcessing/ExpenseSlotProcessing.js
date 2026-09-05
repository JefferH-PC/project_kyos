import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import ReturnButton from '../ReturnButton/ReturnButton';
import './ExpenseSlotProcessing.css';

const ExpenseSlotProcessing = (props) => {
    return (
        <div className={`expense-slot-processing ${props.position || ''}`}>
            <h3>{props.expenseName} - R${props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton onClick={props.onRemove}></RemoveButton>
                <ReturnButton onClick={props.onReturn}></ReturnButton>
                <BuyButton onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotProcessing;