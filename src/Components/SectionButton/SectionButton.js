import './SectionButton.css';

const SectionButton = (props) => {
    return (
        <button className={`section-button ${props.active ? 'active' : ''}`} onClick={props.onClick} type='button'>
            <h2>{props.title}</h2>
        </button>
    )
}

export default SectionButton;