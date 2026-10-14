import './MiddleMilestoneCard.css';

const MiddleMilestoneCard = (props) => {
    return (
        <div className='middle-milestone'>
            <span className='milestone-title'>{props.title}</span>
            <div className='milestone-target'>R$ {props.next}</div>
            <div className='milestone-badge'>R$ {props.remaining}</div>
        </div>
    );
}

export default MiddleMilestoneCard;