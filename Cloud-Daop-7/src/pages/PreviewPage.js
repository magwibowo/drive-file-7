import React from 'react';
import FilePreview from '../components/FilePreview/FilePreview';
import { useParams } from 'react-router-dom';


const PreviewPage = () => {
  // const url = "http://localhost:8000/api/files/preview/uploads/1/namafile.pdf";
  // const { division, filename } = useParams();
  // const fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/uploads/${division}/${filename}`;

  const fileUrl = `http://localhost:8000/api/files/preview/uploads/1/${filename}`;
  



  return (
    <div style={{ padding: '20px' }}>
      <h1>File Preview</h1>
      <Route path="/preview/:division/:filename" element={<PreviewPage />} />
      <FilePreview fileUrl={fileUrl} />
    </div>
  );
};

export default PreviewPage;
