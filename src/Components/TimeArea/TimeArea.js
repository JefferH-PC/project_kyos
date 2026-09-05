import ExpenseSlotReady from "../ExpenseSlotReady/ExpenseSlotReady";
import AddMoreButton from "../AddMoreButton/AddMoreButton";
import ExpenseSlot from "../ExpenseSlot/ExpenseSlot";
import ExpenseSlotProcessing from "../ExpenseSlotProcessing/ExpenseSlotProcessing";
import ExpenseSlotRecovery from "../ExpenseSlotRecovery/ExpenseSlotRecovery";
import "./TimeArea.css";

const TimeArea = (props) => {
    return (
        <div className="time-area">
            <div className="top">
                <h2>{props.title}</h2>
                <AddMoreButton></AddMoreButton>
            </div>
            <div className="expense-area">
                <ExpenseSlot expenseName='Resonance: A Plague Tale Legacy' price={179.99}></ExpenseSlot>
                <ExpenseSlotReady expenseName='Resonance: A Plague Tale Legacy' price={179.99}></ExpenseSlotReady>
                <ExpenseSlotRecovery expenseName='Resonance: A Plague Tale Legacy' price={179.99}></ExpenseSlotRecovery>
            </div>
            <div className="processing-area">
                <ExpenseSlotProcessing expenseName='Resonance: A Plague Tale Legacy' price={179.99}></ExpenseSlotProcessing>
            </div>
            <div className="total">
                <h3>Total: R${props.total}</h3>
            </div>
        </div >
    );
}

export default TimeArea;