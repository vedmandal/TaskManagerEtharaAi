import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="container-fluid py-4 px-4">
        {children}
      </main>
    </>
  );
};

export default Layout;
