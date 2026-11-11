function s(e){return["Approved","Rejected"].includes(e.status)?e.processedBy||e.assigned||"":e.lockedBy||e.assigned||""}export{s as queueChamberUser};
