from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker
import threading
import time
import queue
import pandas as pd
import json
from flask_cors import CORS
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
db = SQLAlchemy(app)

CORS(app, supports_credentials=True)  
job_queue = queue.Queue()

def process_jobs():
    print("Job queue thread started...")

    while True:
        task_id = job_queue.get()
        
        if task_id is None:
            break

        with app.app_context():
            print(f"Processing task {task_id}...")
            task = Task.query.get(task_id)
            task.status = "in progress"
            db.session.commit()
            merged_data = fetch_and_merge_data(json.loads(task.filters))

            print(f"Fetched {len(merged_data)} records for task {task_id}")

            valid_data = []
            for record in merged_data:
                valid_record = {
                    "year": record["YEAR"],
                    "make": record["Make"],
                    "model": record["Model"],
                    "size": record["Size"],
                    "kw": record.get("(kW)", None),
                    "type": record["TYPE"],
                    "city_kWh": record.get("CITY (kWh/100 km)", None),
                    "hwy_kWh": record.get("HWY (kWh/100 km)", None),
                    "comb_kWh": record.get("COMB (kWh/100 km)", None),
                    "city_le": record.get("CITY (Le/100 km)", None),
                    "hwy_le": record.get("HWY (Le/100 km)", None),
                    "comb_le": record.get("COMB (Le/100 km)", None),
                    "g_per_km": record.get("(g/km)", None),
                    "rating": record.get("RATING", None),
                    "km": record.get("(km)", None),
                    "time_h": record.get("TIME (h)", None)
                }
                valid_data.append(valid_record)

            for record in valid_data:
                new_entry = CarData(task_id=task.id, **record)
                db.session.add(new_entry)

            task.status = "completed"
            db.session.commit()

            print(f"Task {task_id} completed!")
            job_queue.task_done()



def fetch_and_merge_data(filters):

    json_data = json.load(open('source_a.json'))
    csv_data = pd.read_csv('source_b.csv').to_dict(orient='records')

    merged = json_data + csv_data

    filtered_data = [record for record in merged if passes_filter(record, filters)]
    
    print(f"Filtered {len(filtered_data)} records matching filters: {filters}")
    return filtered_data


def passes_filter(record, filters):
    if 'startYear' in filters and record.get("YEAR", 0) < filters['startYear']:
        return False
    if 'endYear' in filters and record.get("YEAR", 0) > filters['endYear']:
        return False

    if 'models' in filters and record.get("Make") not in filters['models']:
        return False

    return True


class Task(db.Model):
    id = Column(Integer, primary_key=True)
    status = Column(String, default="pending")
    filters = Column(String)
    data_entries = relationship("CarData", backref="task")

class CarData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    year = db.Column(db.Integer)
    make = db.Column(db.String(50))
    model = db.Column(db.String(50))
    size = db.Column(db.String(50))
    kw = db.Column(db.Float)
    type = db.Column(db.String(10))
    city_kWh = db.Column(db.Float)
    hwy_kWh = db.Column(db.Float)
    comb_kWh = db.Column(db.Float)
    city_le = db.Column(db.Float)
    hwy_le = db.Column(db.Float)
    comb_le = db.Column(db.Float)
    g_per_km = db.Column(db.Float)
    rating = db.Column(db.String(50))
    km = db.Column(db.Integer)
    time_h = db.Column(db.Float)

@app.route('/create_task', methods=['POST'])
def create_task():
    data = request.get_json()

    filters = {
        "startYear": data.get("startYear"),
        "endYear": data.get("endYear"),
        "models": data.get("models", [])
    }

    new_task = Task(status="pending", filters=json.dumps(filters))
    db.session.add(new_task)
    db.session.commit()

    print(f"Task {new_task.id} created with filters: {filters}") 

    job_queue.put(new_task.id)
    return jsonify({"task_id": new_task.id, "status": "pending"})




@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    data_entries = CarData.query.filter_by(task_id=task.id).all()

    data_json = [{
        "year": entry.year,
        "make": entry.make,
        "model": entry.model,
        "size": entry.size,
        "kw": entry.kw,
        "type": entry.type,
        "city_kWh": entry.city_kWh,
        "hwy_kWh": entry.hwy_kWh,
        "comb_kWh": entry.comb_kWh,
        "city_le": entry.city_le,
        "hwy_le": entry.hwy_le,
        "comb_le": entry.comb_le,
        "g_per_km": entry.g_per_km,
        "rating": entry.rating,
        "km": entry.km,
        "time_h": entry.time_h
    } for entry in data_entries]

    return jsonify({"status": task.status, "data": data_json})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("Starting job queue processing...")
    threading.Thread(target=process_jobs, daemon=True).start()
    
    app.run(debug=True)