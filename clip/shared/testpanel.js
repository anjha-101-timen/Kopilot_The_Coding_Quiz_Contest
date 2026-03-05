// Test Panel Tab Switching
document.addEventListener('DOMContentLoaded', function() {
  // Handle tab switching
  const tabs = document.querySelectorAll('.testTab');
  const tabContents = document.querySelectorAll('.testTabContent');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      this.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
  
  // Handle checkbox interactions
  const checkboxes = document.querySelectorAll('.subjectItem input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (label) {
        label.style.textDecoration = this.checked ? 'none' : 'line-through';
        label.style.opacity = this.checked ? '1' : '0.6';
      }
    });
  });
  
  // Handle start test button clicks
  const startButtons = document.querySelectorAll('.btn.primary');
  startButtons.forEach(button => {
    if (button.textContent.includes('Start')) {
      button.addEventListener('click', function() {
        // Simulate starting a test
        this.innerHTML = '<span class="btnIcon">⏳</span> Starting...';
        this.disabled = true;
        
        setTimeout(() => {
          this.innerHTML = '<span class="btnIcon">✅</span> Test Started';
          setTimeout(() => {
            this.innerHTML = '<span class="btnIcon">🚀</span> Start Practice Test';
            this.disabled = false;
          }, 2000);
        }, 1500);
      });
    }
  });
  
  // Add hover effects to stat cards
  const statCards = document.querySelectorAll('.statCard');
  statCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 25px rgba(124,58,237,0.3)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });
  
  // Handle settings changes
  const settingSelects = document.querySelectorAll('.settingSelect');
  settingSelects.forEach(select => {
    select.addEventListener('change', function() {
      console.log(`Setting changed: ${this.previousElementSibling.textContent} = ${this.value}`);
    });
  });
});
