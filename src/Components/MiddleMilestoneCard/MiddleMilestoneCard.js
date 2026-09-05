import './MiddleMilestoneCard.css';

const MiddleMilestoneCard = (props) => {
    return (
        <div className='middle-milestone'>
            <h2 className='milestone-title'>{props.title}</h2>
            <h2>R${props.next}</h2>
            <h2>R${props.remaining}</h2>
        </div>
    );
}

export default MiddleMilestoneCard;