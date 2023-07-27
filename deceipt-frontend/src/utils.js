let flash_message_count = 0;
function flash_message(message,category='error'){
    const flash_message = document.createElement('div')
    flash_message.classList.add('flash')
    flash_message.classList.add(category);
    flash_message.id = `flash_${++flash_message_count}`
    flash_message.innerHTML = `<span> ${message} </span>`
    const flash_container = document.querySelector("#flash_container")
    flash_container.appendChild(flash_message)    
    flash_message.style.opacity = 1;
    setTimeout(()=>{
        if(!flash_message.matches(":hover") && flash_container.contains(flash_message)){
            flash_message.style.opacity = 0;
            flash_container.removeChild(flash_message)
        }
    },5000)
    flash_message.addEventListener("pointerout",()=>{
        flash_message.style.opacity = 0;
        flash_container.removeChild(flash_message);
    })
}
export default flash_message