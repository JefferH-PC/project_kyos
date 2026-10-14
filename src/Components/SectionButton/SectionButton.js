import './SectionButton.css';

const SectionButton = (props) => {
    return (
        <button className={`section-button ${props.active ? 'active' : ''}`} onClick={props.onClick} type='button'>
            <span className='section-title'>{props.title}</span>
        </button>
    );
};

export default SectionButton;