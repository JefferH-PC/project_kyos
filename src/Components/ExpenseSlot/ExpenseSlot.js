import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import UpdateButton from '../UpdateButton/UpdateButton';
import './ExpenseSlot.css';

const ExpenseSlot = (props) => {
    return (
        <div className={`expense-slot ${props.position || ''}`}>
            <h3>{props.expenseName} - R$ {props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <UpdateButton label={props.updateLabel} onClick={props.onUpdate}></UpdateButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlot;