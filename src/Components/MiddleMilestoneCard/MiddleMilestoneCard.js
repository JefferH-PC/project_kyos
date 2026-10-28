import './MiddleMilestoneCard.css';

const MiddleMilestoneCard = (props) => {
    const hasProgress = typeof props.progress === 'number' && Number.isFinite(props.progress);
    const pct = hasProgress ? Math.max(0, Math.min(100, Math.round(props.progress))) : null;

    return (
        <div className='middle-milestone'>
            <div className='milestone-header-row'>
                <span className='milestone-title'>{props.title}</span>
                {pct !== null && <span className='milestone-pct'>{pct}%</span>}
            </div>
            <div className='milestone-target'>R$ {props.next}</div>
            {pct !== null && (
                <div className='milestone-progress-track' aria-hidden='true'>
                    <div className='milestone-progress-fill' style={{ width: `${pct}%` }} />
                </div>
            )}
            <div className='milestone-badge'>R$ {props.remaining}</div>
        </div>
    );
}

export default MiddleMilestoneCard;
