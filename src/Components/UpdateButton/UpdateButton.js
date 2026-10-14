import './UpdateButton.css';

const UpdateButton = (props) => {
    return (
        <button className='update-button' onClick={props.onClick} aria-label={props.label || 'Move slot to processing'} type='button'>
            <svg className='update' xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80A8,8,0,0,1,88,208V48a8,8,0,0,1,13.66-5.66l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
        </button>
    );
}

export default UpdateButton