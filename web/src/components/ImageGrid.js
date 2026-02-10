export default function ImageGrid() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <img src="/images/home/img1.png" 
           alt="zdj 1" 
           className="w-48 h-48 object-cover rounded" />

      <img src="/images/home/img2.png" 
           alt="zdj 2" 
           className="w-48 h-48 object-cover rounded" />

      <img src="/images/home/img3.png" 
           alt="zdj 3" 
           className="w-48 h-48 object-cover rounded" />

      <img src="/images/home/img4.png" 
           alt="zdj 4" 
           className="w-48 h-48 object-cover rounded" />
    </div>
  );
}
