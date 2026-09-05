import './App.css';
import ExpenseSlot from './Components/ExpenseSlot/ExpenseSlot';
import Header from './Components/Header/Header';
import TimeArea from './Components/TimeArea/TimeArea';


function App() {
  return (
    <div className='app'>
      <Header></Header>
      <div className='app-areas'>
        <TimeArea title='Wishlist' total={179.99}></TimeArea>
        <TimeArea title='Recovery' total={0}></TimeArea>
      </div>
    </div>
  );
}

export default App;
